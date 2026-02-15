variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "docker_host" {
  description = "Docker/Podman API endpoint"
  type        = string
  default     = "unix:///run/podman/podman.sock"
}

variable "public_network_name" {
  description = "Name of public network"
  type        = string
  default     = "public_net"
}

variable "public_network_subnet" {
  description = "CIDR for public network"
  type        = string
  default     = "172.18.0.0/16"
}

variable "private_network_name" {
  description = "Name of private network"
  type        = string
  default     = "private_net"
}

variable "private_network_subnet" {
  description = "CIDR for private network"
  type        = string
  default     = "172.19.0.0/16"
}

variable "storage_volume_name" {
  description = "Name of mime storage volume"
  type        = string
  default     = "mime_storage"
}

variable "enable_monitoring" {
  description = "Enable Prometheus/Grafana monitoring"
  type        = bool
  default     = true
}
