# Terraform Infrastructure Configuration

## Quick Start

```bash
# Initialize Terraform
terraform init

# Plan changes for development
terraform plan -var-file=environments/dev.tfvars

# Apply changes
terraform apply -var-file=environments/dev.tfvars

# Destroy infrastructure
terraform destroy -var-file=environments/dev.tfvars
```

## Environments

- **dev**: Local development environment
- **staging**: Pre-production testing
- **prod**: Production deployment

## Files

- `main.tf`: Core infrastructure definitions
- `variables.tf`: Input variables and validation
- `outputs.tf`: Output values
- `environments/`: Environment-specific configurations
- `modules/`: Reusable Terraform modules

## State Management

State is stored locally in `terraform.tfstate`. For production, use remote state (S3, Terraform Cloud, etc.).

```hcl
backend "s3" {
  bucket = "my-terraform-state"
  key    = "evolution/phase1/terraform.tfstate"
}
```

