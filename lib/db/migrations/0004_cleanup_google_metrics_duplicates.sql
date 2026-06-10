-- Cleanup duplicate Google metrics rows while keeping the latest record
-- per project_id + metric_type + data_source.

WITH gsc_ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY project_id, metric_type, data_source
      ORDER BY measured_at DESC, created_at DESC, id DESC
    ) AS rn
  FROM gsc_metrics
  WHERE data_source IN ('gsc_api', 'google_api')
)
DELETE FROM gsc_metrics
WHERE id IN (
  SELECT id
  FROM gsc_ranked
  WHERE rn > 1
);

WITH ga4_ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY project_id, metric_type, data_source
      ORDER BY measured_at DESC, created_at DESC, id DESC
    ) AS rn
  FROM ga4_metrics
  WHERE data_source IN ('ga4_api', 'google_api')
)
DELETE FROM ga4_metrics
WHERE id IN (
  SELECT id
  FROM ga4_ranked
  WHERE rn > 1
);
