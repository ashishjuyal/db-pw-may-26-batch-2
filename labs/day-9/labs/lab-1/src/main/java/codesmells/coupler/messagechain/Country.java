package codesmells.coupler.messagechain;

public class Country {
  private final String countryName;
  private final String continentName;

  Country(String country, String continent) {
    this.countryName = country;
    this.continentName = continent;
  }

  public String getCountryName() {
    return countryName;
  }

  public String getContinentName() {
    return continentName;
  }
}
