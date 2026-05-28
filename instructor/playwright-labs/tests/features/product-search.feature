Feature: Product Search
  As a logged-in customer
  I want to search for products
  So that I can find what I need

  Background:
    Given I am logged in as a standard customer

  Scenario: Search returns a matching product
    When I search for "Keyboard"
    Then I should see 1 product in the results
    And the product name should be "Mechanical Keyboard"

  Scenario: Search with no results shows the empty state
    When I search for "xyzproductthatdoesnotexist"
    Then I should see the message "No products found matching your search."