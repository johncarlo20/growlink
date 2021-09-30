export class ProductInventoryResponse {
  Product: ProductResponse;
  SerialNumber: string;
  Ssid: string;
}

export class ProductResponse {
  ProductType: number;
  Name: string;
  Description: string;
}
