# Architecture Evolution: Phase 1 - Foundation
# Terraform configuration for multi-environment infrastructure

terraform {
  required_version = ">= 1.0"

  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }

  # Uncomment for remote state (AWS S3, etc.)
  # backend "s3" {
  #   bucket         = "my-terraform-state"
  #   key            = "evolution/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-locks"
  # }

  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "docker" {
  # For Podman: unix:///run/podman/podman.sock
  # For Docker: unix:///var/run/docker.sock
  host = var.docker_host
}

# =============================================================================
# NETWORKS
# =============================================================================

resource "docker_network" "public_net" {
  name     = var.public_network_name
  driver   = "bridge"
  internal = false

  ipam_config {
    subnet = var.public_network_subnet
  }

  labels = {
    "zone"        = "public"
    "environment" = var.environment
  }
}

resource "docker_network" "private_net" {
  name     = var.private_network_name
  driver   = "bridge"
  internal = true  # No external access

  ipam_config {
    subnet = var.private_network_subnet
  }

  labels = {
    "zone"        = "private"
    "environment" = var.environment
  }
}

# =============================================================================
# VOLUMES
# =============================================================================

resource "docker_volume" "mime_storage" {
  name = var.storage_volume_name

  labels = {
    "service"     = "mime-server"
    "environment" = var.environment
  }
}

# =============================================================================
# OUTPUTS
# =============================================================================

output "public_network_id" {
  description = "ID of public network"
  value       = docker_network.public_net.id
}

output "private_network_id" {
  description = "ID of private network"
  value       = docker_network.private_net.id
}

output "storage_volume_name" {
  description = "Name of MIME storage volume"
  value       = docker_volume.mime_storage.name
}
