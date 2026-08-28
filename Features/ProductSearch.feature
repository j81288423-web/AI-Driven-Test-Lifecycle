@FeatureProductSearch
Feature: Product Search

  @TC_006
  Scenario: TC_001 - Verify Product Search Returns Matching Results and Success State
    Given the user navigates to the application
    When the user clicks the Products link
    When the user fills the search input with "T-shirt"
    When the user clicks the search button
    Then the searched products heading should be visible
    Then matching search results should be returned
    Then the search input should retain "T-shirt"
    Then the URL should contain "search=T-shirt"
    When the user clicks the first View Product link
    Then the product details page should be visible
    Then the product title "Pure Cotton V-Neck T-Shirt" should be visible
    Then the quantity input should be visible
    Then the Add to cart button should be visible
