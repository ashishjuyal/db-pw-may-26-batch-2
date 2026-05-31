package codesmells.bloaters.primitive;

import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

public class ProductServiceTest {

    ProductService service;
    Product product;
    @Before public void
    setup() {
        service = new ProductService();
        product = new Product();
    }

    @Test public void
    should_add_product_to_cart_when_product_id_starts_with_PD() {
        product.setProductId("PD123");
        assertTrue(service.addProductToCart(product));
    }

    @Test public void
    should_NOT_add_product_to_cart_when_product_id_does_not_starts_with_PD() {
        product.setProductId("AA123");
        assertFalse(service.addProductToCart(product));
    }
}