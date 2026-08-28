@FeatureProducts
Feature: Product Search

  @TC_006
  Scenario: TC_006 - Verify Product Search Succeeds With A Valid Keyword
    Given the user navigates to the application
    When the user clicks Products link
    When the user fills search input with "T shirt"
    When the user clicks search submit button
    Then the search results should be displayed
    Then the success confirmation message should be visible
    Then the search state should be persisted
