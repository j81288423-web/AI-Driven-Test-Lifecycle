@FeatureTC_001
Feature: Verify Product Search Completes Successfully for a Valid Keyword

  @TC_006
  Scenario: TC_001 - Verify Product Search Completes Successfully for a Valid Keyword
    Given the user navigates to the application
    When the user clicks Products link
    When the user fills search keyword "T-shirt"
    When the user clicks Submit Search button
    Then the searched products heading should be visible
    And the search results should contain matching products
