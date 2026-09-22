"use client";

import { startTransition, useEffect, useState } from "react";

import type { DummyService } from "@/lib/gigxomi/dummy-platform-store";

async function fetchPendingServices() {
  const response = await fetch("/api/freelancer/services", { cache: "no-store" });
  const payload = await response.json();
  return ((payload.services ?? []) as DummyService[]).filter((service) => service.status === "Pending Review");
}

export function ManagerServiceReviewBoard() {
  const [services, setServices] = useState<DummyService[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchPendingServices()
      .then((items) => {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setServices(items);
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setServices([]);
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function review(serviceId: string, action: "approve" | "reject") {
    const response = await fetch(`/api/freelancer/services/${serviceId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const payload = await response.json();
    setStatus(payload.service?.reviewNote ?? `Service ${action}d.`);
    const nextServices = await fetchPendingServices().catch(() => []);
    startTransition(() => {
      setServices(nextServices);
    });
  }

  return (
    <div className="board-list">
      {status ? <p className="helper-text">{status}</p> : null}
      {services.map((service) => (
        <article className="lead-row" key={service.id}>
          <div className="status-row">
            <span className="meta-pill">{service.category}</span>
            <span className="meta-pill">{service.deliveryTime}</span>
          </div>
          <h3>{service.title}</h3>
          <p>{service.summary}</p>
          <p>
            <strong>Target audience:</strong> {service.targetAudience}
          </p>
          <div className="freelancer-action-grid">
            <button className="freelancer-primary-button" onClick={() => review(service.id, "approve")} type="button">
              Approve for publish
            </button>
            <button className="freelancer-secondary-button" onClick={() => review(service.id, "reject")} type="button">
              Send back
            </button>
          </div>
        </article>
      ))}
      {!services.length ? <p className="muted-copy">No submitted services are waiting in the manager review queue right now.</p> : null}
    </div>
  );
}
