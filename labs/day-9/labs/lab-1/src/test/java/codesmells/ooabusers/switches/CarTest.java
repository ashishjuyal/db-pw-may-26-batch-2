package codesmells.ooabusers.switches;

import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.*;

public class CarTest {
  ICar sportsCar;
  ICar familyCar;
  ICar smallCar;
  ICar defaultCar;

  @Before public void
  setup() {
    sportsCar = new Car(Car.SPORTS);
    familyCar = new Car(Car.FAMILY);
    smallCar = new Car(Car.SMALL);
    defaultCar = new Car(Car.DEFAULT);
  }

  @Test public void
  should_return_the_fuel_capacity_of_the_sports_car() {
    assertEquals("100 liters", sportsCar.fuelCapacity());
  }

  @Test public void
  should_return_the_fuel_capacity_of_the_family_car() {
    assertEquals("40 liters", familyCar.fuelCapacity());
  }

  @Test public void
  should_return_the_fuel_capacity_of_the_small_car() {
    assertEquals("20 liters", smallCar.fuelCapacity());
  }

  @Test public void
  should_return_the_fuel_capacity_of_the_default_car() {
    assertEquals("50 liters", defaultCar.fuelCapacity());
  }

  @Test public void
  should_return_the_fuel_average_of_the_sports_car() {
    assertEquals("3 Km/Liter", sportsCar.fuelAverage());
  }

  @Test public void
  should_return_the_fuel_average_of_the_family_car() {
    assertEquals("10 Km/Liter", familyCar.fuelAverage());
  }

  @Test public void
  should_return_the_fuel_average_of_the_small_car() {
    assertEquals("15 Km/Liter", smallCar.fuelAverage());
  }

  @Test public void
  should_return_the_fuel_average_of_the_default_car() {
    assertEquals("12 Km/Liter", defaultCar.fuelAverage());
  }

  @Test public void
  should_return_the_features_of_the_sports_car() {
    assertEquals("Sports car limited edition", sportsCar.features());
  }

  @Test public void
  should_return_the_features_of_the_family_car() {
    assertEquals("Best family car in the segment", familyCar.features());
  }

  @Test public void
  should_return_the_features_of_the_small_car() {
    assertEquals("Very small car", smallCar.features());
  }

  @Test public void
  should_return_the_features_of_the_default_car() {
    assertEquals("default car", defaultCar.features());
  }

}