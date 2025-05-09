// utils/productStorage.js
export const saveUserProduct = (userId, productId) => {
  localStorage.setItem(`selectedProduct-${userId}`, productId);
};

export const getUserProduct = (userId) => {
  return localStorage.getItem(`selectedProduct-${userId}`);
};
