# Kubernetes Deployment

This directory contains the production deployment manifests for SEQ-LAMS.

## Layout

- `base/`: portable Kubernetes manifests for the full application stack
- `aws/`: AWS EKS overlay with Application Load Balancer ingress annotations and ECR image mapping

The base stack now includes:

- frontend
- gateway
- backend
- PostgreSQL
- Redis
- RabbitMQ
- ClickHouse

## Base Deployment

1. Update `base/configmap.yaml` with your public hostname.
2. Replace the local/demo values in `base/secrets.yaml` before using a shared or production cluster.
3. Apply the manifests:

```bash
kubectl apply -k k8s/base
```

## AWS EKS Deployment

1. Push the frontend, gateway, and backend images to Amazon ECR.
2. Replace the placeholder ECR registry IDs in `aws/kustomization.yaml`.
3. Make sure the AWS Load Balancer Controller is installed in the cluster.
4. Apply the overlay:

```bash
kubectl apply -k k8s/aws
```

## Services

- Frontend is exposed through the ingress.
- Gateway is the internal API ingress for the frontend and routes `/api/v1/**` traffic to the backend.
- Backend, PostgreSQL, Redis, RabbitMQ, and ClickHouse remain internal cluster services.
- Update `APP_FRONTEND_URL` to match the public ingress hostname so generated QR codes use the correct public URL.
- Update `BACKEND_API_URL` so the frontend points at the gateway service inside the cluster.
- Keep `APP_MESSAGING_ENABLED` and `APP_ANALYTICS_OLAP_ENABLED` enabled for the full enterprise topology.
