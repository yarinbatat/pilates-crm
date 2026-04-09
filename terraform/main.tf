# Resource Group
resource "azurerm_resource_group" "pilates_rg" {
  name     = "pilates-crm-prod-rg"
  location = "Israel Central"
}

# Container Registry (ACR)
resource "azurerm_container_registry" "pilates_acr" {
  name                = "pilatescrmregistry"
  resource_group_name = azurerm_resource_group.pilates_rg.name
  location            = azurerm_resource_group.pilates_rg.location
  sku                 = "Basic"
  admin_enabled       = true
}

# AKS Cluster (Kubernetes)
resource "azurerm_kubernetes_cluster" "pilates_aks" {
  name                = "pilates-aks-cluster"
  location            = azurerm_resource_group.pilates_rg.location
  resource_group_name = azurerm_resource_group.pilates_rg.name
  dns_prefix          = "pilatescrm"

  default_node_pool {
    name       = "default"
    node_count = 2
    vm_size    = "Standard_D2s_v3"
  }

  identity {
    type = "SystemAssigned"
  }
}