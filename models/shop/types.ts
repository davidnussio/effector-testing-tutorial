export type DeliveryCountry = "CH" | "IT";

export type DeliveryCountryPrices = { [key in DeliveryCountry]: number };

export type AboTypes = "standard" | "pro" | "enterprise";

export type CartProducts = {
  sponsor: { quantity: number };
  graphic: { quantity: number };
  logo: { quantity: number };
};
export type CartProductType = keyof CartProducts;

export type CartProduct = {
  type: CartProductType;
  quantity: number;
};

export type Product = {
  maxCards: number;
  upgradeAbo: AboTypes;
  abo: {
    unitAmount: number;
  };
  cards: {
    sponsor: {
      unitAmount: number;
    };
    logo: {
      unitAmount: number;
    };
    graphic: {
      unitAmount: number;
    };
  };
  deliveryCountry: {
    CH: {
      unitAmount: number;
    };
    IT: {
      unitAmount: number;
    };
  };
};
