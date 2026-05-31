package codesmells.coupler.featureenvy;

public class Item {
  private float price, tax, discount;
  private boolean onSale;

  Item(float price,float tax, float discount, boolean onSale) {
    this.price = price;
    this.tax = tax;
    this.discount = discount;
    this.onSale = onSale;
  }

  public float getPrice(){
    return price;
  }

  public float getSaleDiscount() {
    return discount;
  }

  public float getTax(){
    return tax;
  }

  public boolean isOnSale() {
    return onSale;
  }

}
