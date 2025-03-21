import axios from "axios";
import { createContext, useContext, useEffect, useReducer } from "react";
import toast from "react-hot-toast";

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_TO_CART": {
      const { slug } = action.payload;
      toast.success("Add to Cart Successfully");
      return {
        ...state,
        [slug]: state[slug]
          ? { quantity: state[slug].quantity + 1 }
          : { quantity: 1 },
      };
    }
    case "REMOVE_FROM_CART": {
      const newState = { ...state };
      delete newState[action.payload.slug];
      toast.success("Remove from Cart Successfully");
      return newState;
    }
    case "UPDATE_QUANTITY": {
      const { slug, quantity } = action.payload;
      if (quantity <= 0) {
        const newState = { ...state };
        delete newState[slug];
        return newState;
      }
      toast.success("Update Cart Quantity Successfully");
      return {
        ...state,
        [slug]: { ...state[slug], quantity },
      };
    }
    case "CLEAR_CART":
      toast.success("Cart Cleared Successfully");
      return {};
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, {}, () => {
    const localData = localStorage.getItem("cart");
    return localData ? JSON.parse(localData) : {};
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = async (slug) => {
    const { data } = await axios.get(`/api/v1/product/get-product/${slug}`);
    if (!data.product) {
      toast.error("Item does not exist");
      return;
    }

    const inventory = data.product.quantity;

    if (cart[slug] && cart[slug].quantity + 1 > inventory) {
      toast.error("Error added to cart: Not enough inventory");
      return;
    }

    dispatch({ type: "ADD_TO_CART", payload: { slug } });
  };

  const removeFromCart = (slug) => {
    dispatch({ type: "REMOVE_FROM_CART", payload: { slug } });
  };

  const updateQuantity = async (slug, quantity) => {
    const { data } = await axios.get(`/api/v1/product/get-product/${slug}`);
    if (!data.product) {
      toast.error("Item does not exist");
      return;
    }

    const inventory = data.product.quantity;

    if (cart[slug] && quantity > inventory) {
      toast.error("Error updating quantity: Not enough inventory");
      return;
    }
    dispatch({ type: "UPDATE_QUANTITY", payload: { slug, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  return useContext(CartContext);
};
