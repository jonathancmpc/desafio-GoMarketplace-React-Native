import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem(
        '@GoMarketPlace:CartItems',
      );

      if (storageProducts) {
        setProducts([...JSON.parse(storageProducts)]);
      }
    }

    loadProducts();
  }, []);

  /* Incrementa a quantidade de itens caso exista esse item no carrinho */
  const increment = useCallback(
    async id => {
      const newProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketPlace:CartItems',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(item => item.id === product.id);

      /* Verifica se existe o item no carrinho, se existir chamamos o método increment e passamos o id(Então utilizamos a lógica do increment para incrementar o item ao carrinho) */
      if (productExists) {
        increment(productExists.id);
        console.log('Incrementa o item');
      } else {
        const newproduct = product;
        /* Adicionando o item quantity no objeto */
        newproduct.quantity = 1;

        setProducts([...products, newproduct]);
        console.log('Novo item adicionado');
      }

      /* Inserindo no Storage para todas as páginas terem acesso */
      await AsyncStorage.setItem(
        '@GoMarketPlace:CartItems',
        JSON.stringify(products),
      );
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = products.map(product =>
        product.id === id && product.quantity > 0
          ? { ...product, quantity: product.quantity - 1 }
          : product,
      );

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketPlace:CartItems',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
