CREATE UNIQUE INDEX IF NOT EXISTS jobs_order_type_uniq ON jobs (order_id, job_type);
CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_event_uniq ON webhook_events (event_id);
