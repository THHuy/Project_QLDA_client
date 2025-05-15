import MenuProducts from "~/components/Layout/MenuProducts";
import ProductsContent from "~/components/ProductsContent";
function ProductAdmin() {
  return (
    <div>
      <MenuProducts children={<ProductsContent />} />
    </div>
  );
}

export default ProductAdmin;
