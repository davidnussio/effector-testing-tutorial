export const loadProductApi = async (productType: string): Promise<any> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(productType);
    }, 3000);
  });
