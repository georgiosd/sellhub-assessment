import { MouseEventHandler, useCallback, useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  inventory_count: number;
};

function askQuantity() {
  const s = prompt("How many items do you want to purchase?");

  if (!s) {
    return "cancel";
  }

  return parseInt(s);
}

async function fetchProducts() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  const products: Product[] = await response.json();

  return products;
}

type PurchaseProductResult =
  | {
      status: 200;
      data: { inventory_count: number };
    }
  | {
      status: 400 | 404;
      data: { error: string };
    };

async function purchaseProduct(id: string, count: number) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/products/${id}/purchase`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        inventory_count: count,
      }),
    }
  );

  return {
    status: response.status,
    data: await response.json(),
  } as PurchaseProductResult;
}

function getPurchaseMessage({ status, data }: PurchaseProductResult) {
  if (status === 200) {
    return `Purchase OK! New inventory count: ${data.inventory_count}`;
  }

  return `Error: ${data.error}`;
}

// this was left untidy for the sake of speed
export default function StoreIndex() {
  const [products, setProducts] = useState<Product[] | undefined | "error">();
  const [purchaseState, setPurchaseState] = useState<
    undefined | "loading" | string
  >();

  const updateProducts = useCallback(async () => {
    const result = await fetchProducts();

    result.sort((x, y) => y.inventory_count - x.inventory_count);

    setProducts(result);
  }, []);

  useEffect(() => {
    updateProducts().catch(() => setProducts("error"));
  }, [updateProducts]);

  const handlePurchase = useCallback<MouseEventHandler<HTMLButtonElement>>(
    async (e) => {
      e.preventDefault();

      const id = e.currentTarget.getAttribute("data-id")!;

      let count: ReturnType<typeof askQuantity>;

      do {
        count = askQuantity();
      } while (count != "cancel" && isNaN(count));

      if (count == "cancel") {
        return;
      }

      setPurchaseState("loading");

      const result = await purchaseProduct(id, count as number);

      setPurchaseState(getPurchaseMessage(result));
      updateProducts().catch(() => setProducts("error"));
    },
    [updateProducts]
  );

  return (
    <div>
      <h1>Store Index</h1>

      {purchaseState && <p>Purchase: {purchaseState}</p>}

      {products === undefined && <p>Loading...</p>}
      {products === "error" && <p>Failed to load products</p>}
      {Array.isArray(products) && (
        <table>
          <thead>
            <td>ID</td>
            <td>Name</td>
            <td>Inventory count</td>
            <td />
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.inventory_count}</td>
                <td>
                  <button data-id={product.id} onClick={handlePurchase}>
                    Purchase
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
