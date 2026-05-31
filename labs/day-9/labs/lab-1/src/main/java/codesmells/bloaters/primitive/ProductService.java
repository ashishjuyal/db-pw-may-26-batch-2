package codesmells.bloaters.primitive;

import java.util.ArrayList;
import java.util.List;

public class ProductService {

    private List<Product> cart = new ArrayList<>();

    public boolean addProductToCart(Product product) {
        String productId = product.getId();

        if(isValid(productId)) {
            return cart.add(product);
        }
        return false;
    }

    private boolean isValid(String productId) {
        return productId.startsWith("PD");
    }
}
