package codesmells.bloaters.primitive;

public class Product {
    private String productId;
    private String name;

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public String getId() {
        return productId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
