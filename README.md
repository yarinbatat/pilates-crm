# Pilates CRM & Management System

A professional Full-stack CRM system designed for Pilates studios, featuring class scheduling, student management, and automated workflows. This project serves as a comprehensive demonstration of Modern DevOps practices, Cloud Infrastructure, and Scalable Web Architecture.

## 🚀 DevOps & Infrastructure Stack

This project is built with a "Production-First" mindset, utilizing industry-standard tools:

* **Infrastructure as Code (IaC):** Terraform (Azure provider)
* **Orchestration:** Kubernetes (Azure AKS)
* **Containerization:** Docker & Docker Compose
* **CI/CD Pipeline:** GitHub Actions (Planned)
* **Database:** PostgreSQL with Prisma ORM
* **Cloud Provider:** Microsoft Azure

## 🏗 Architecture Overview

The application is containerized and designed to run in a distributed environment:
1.  **Frontend/Backend:** Next.js application running in Docker.
2.  **Database:** Managed PostgreSQL (or containerized for Dev).
3.  **State Management:** Prisma ORM for schema migrations and type-safety.

## 📂 Project Structure

```text
├── terraform/          # Azure Infrastructure (AKS, ACR, Networking)
├── kubernetes/         # K8s Manifests (Deployments, Services, Secrets)
├── prisma/             # Database Schema & Migrations
├── src/                # Next.js Application Code
├── Dockerfile          # Multi-stage production build
└── docker-compose.yml  # Local development environment

🛠 Getting Started (Development)
To run this project locally using Docker Compose:

Clone the repository:

Bash
git clone [https://github.com/your-username/pilates-crm.git](https://github.com/your-username/pilates-crm.git)
cd pilates-crm
Environment Setup:
Create a .env file and configure your DATABASE_URL.

Spin up the environment:

Bash
docker-compose up -d
Sync Database Schema:

Bash
docker exec -it pilates-app npx prisma db push
☁️ Cloud Deployment (Production-Ready)
The infrastructure is fully defined using Terraform. To deploy to Azure:

Initialize Terraform:

Bash
cd terraform
terraform init
Plan and Apply:

Bash
terraform plan
terraform apply
Deploy to Kubernetes:

Bash
kubectl apply -f ../kubernetes/



🧑‍💻 Author
Yarin Batat IT Professional & Aspiring DevOps Engineer LinkedIn | GitHub
