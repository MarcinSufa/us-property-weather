# Acceptance criteria

These stable ids are the source for test names. Every test name starts with the id of the criterion it covers. Later slices add criteria without renumbering existing ones.

## CREATE

### AC-CREATE-1

Source: plan 5
Given a valid property address
When the client calls `createProperty`
Then the response contains the stored property fields, coordinates, weather data and creation time.

### AC-CREATE-2

Source: plan 7, Create step 2
Given a street value with leading or trailing whitespace
When the service validates the create input
Then it trims the street before storing it.

### AC-CREATE-3

Source: plan 7, Create step 2
Given a city value with leading or trailing whitespace
When the service validates the create input
Then it trims the city before storing it.

### AC-CREATE-4

Source: plan 7, Create step 2
Given a street value shorter than 1 or longer than 200 characters after trimming
When the client calls `createProperty`
Then the input is rejected with `BAD_USER_INPUT`.

### AC-CREATE-5

Source: plan 7, Create step 2
Given a city value shorter than 1 or longer than 100 characters after trimming
When the client calls `createProperty`
Then the input is rejected with `BAD_USER_INPUT`.

### AC-CREATE-6

Source: plan 7, Create step 2
Given a zip code that is not exactly five digits
When the client calls `createProperty`
Then the input is rejected with `BAD_USER_INPUT`.

### AC-CREATE-7

Source: plan 5, Choices inside the schema
Given a state value outside the `UsState` enum
When the client submits the GraphQL operation
Then GraphQL rejects the state before the service runs.

### AC-CREATE-8

Source: plan 10, New property route
Given the new-property form
When the user enters an empty required field, a zip code not matching the five-digit pattern, or a value beyond its maximum length
Then native form constraints prevent the request.

### AC-CREATE-9

Source: plan 10, New property route
Given the server returns field errors for a create request
When the form displays the response
Then each field error appears under its field.

### AC-CREATE-10

Source: plan 10, New property route
Given a successful create request
When the response contains the new property
Then the app navigates to that property's detail page.

### AC-CREATE-11

Source: plan 10, New property route
Given the new-property form
When it renders
Then every input has a label tied to it.

### AC-CREATE-12

Source: plan 10, New property route
Given the form displays an error
When assistive technology reads the page
Then the error is announced through `aria-live`.

### AC-CREATE-13

Source: plan 10, New property route
Given the server returns field errors
When the form displays them
Then focus moves to the first invalid field.

### AC-CREATE-14

Source: plan 10, New property route
Given the create request is running
When the form is displayed
Then the submit button is disabled.

### AC-CREATE-15

Source: plan 10, New property route
Given the create request fails with a weather error code
When the form displays the error
Then one alert above the form contains a sentence for that code.

### AC-CREATE-16

Source: plan 6, Data model
Given Weatherstack returns a `current` object
When the property is inserted
Then the entire object is stored as JSON text.

### AC-CREATE-17

Source: plan 6, Data model
Given a property is inserted
When the database creates its row
Then `created_at` is set by the database with millisecond precision.

## LIST

### AC-LIST-1

Source: plan 5
Given properties have been stored
When the client calls `properties`
Then the response contains the property list.

### AC-LIST-2

Source: plan 10, `/` route
Given properties are returned for the list page
When the page renders them
Then its table shows street, city, state, zip code, creation time, temperature and description.

### AC-LIST-3

Source: plan 10, loading, empty and error states
Given no properties exist
When the list page finishes loading
Then it shows “no properties yet”.

### AC-LIST-4

Source: plan 10, loading, empty and error states
Given the list request is pending or fails
When the list page renders
Then it shows a loading state while pending and an error state after failure.

### AC-LIST-5

Source: plan 10, urql detail
Given the list is empty
When a property is created
Then the list query refreshes and the new property appears.

## FILTER

### AC-FILTER-1

Source: plan 7, List, detail, delete
Given a city filter containing surrounding whitespace and different letter case
When the client calls `properties`
Then the filter trims surrounding whitespace and matches the whole city name case-insensitively.

### AC-FILTER-2

Source: plan 7, List, detail, delete
Given a city filter that is only part of a stored city name
When the client calls `properties`
Then that property does not match the city filter.

### AC-FILTER-3

Source: plan 7, List, detail, delete
Given a state filter
When the client calls `properties`
Then state matching is exact.

### AC-FILTER-4

Source: plan 7, List, detail, delete
Given a zip-code filter
When the client calls `properties`
Then zip-code matching is exact.

### AC-FILTER-5

Source: plan 7, List, detail, delete
Given a filter value that is empty or blank
When the client calls `properties`
Then that filter applies no restriction.

### AC-FILTER-6

Source: plan 7, List, detail, delete
Given a zip-code filter that is not exactly five digits
When the client calls `properties`
Then the request fails with `BAD_USER_INPUT`.

### AC-FILTER-7

Source: plan 10, `/` route
Given the user applies city, state or zip-code filters
When the filtered list is displayed
Then the filters are represented in the URL and the back button restores the prior view.

### AC-FILTER-8

Source: plan 10, loading, empty and error states
Given filters match no properties
When the list page finishes loading
Then it shows “nothing matches the filters”, distinct from “no properties yet”.

## SORT

### AC-SORT-1

Source: plan 5, plan 7, List, detail, delete
Given properties with different creation times
When the client calls `properties` without a sort argument
Then properties are returned newest first.

### AC-SORT-2

Source: plan 5, plan 7, List, detail, delete
Given properties with different creation times
When the client requests `CREATED_AT_ASC`
Then properties are returned oldest first.

### AC-SORT-3

Source: plan 6, Data model
Given two rows with the same creation millisecond
When the list is sorted by creation time
Then the rows keep their insertion order.

### AC-SORT-4

Source: plan 10, `/` route
Given the user changes the sort control
When the list is displayed
Then the selected sort is represented in the URL and the back button restores the prior view.

## DETAIL

### AC-DETAIL-1

Source: plan 5
Given a property id that exists
When the client calls `property`
Then the response contains that property's details, coordinates and stored weather data.

### AC-DETAIL-2

Source: plan 5, Choices inside the schema
Given a property id that does not exist
When the client calls `property`
Then the response is null.

### AC-DETAIL-3

Source: plan 10, `/properties/:id` route
Given a property detail request is pending or fails
When the detail page renders
Then it shows a loading state while pending and an error state after failure.

### AC-DETAIL-4

Source: plan 10, `/properties/:id` route
Given a property id that does not exist
When the detail page finishes loading
Then it shows a not-found state.

### AC-DETAIL-5

Source: plan 10, `/properties/:id` route
Given a property with stored weather data
When its detail page renders
Then the weather card labels it as the weather at creation and shows its observation time.

## DELETE

### AC-DELETE-1

Source: plan 5, plan 7, List, detail, delete
Given a property id that exists
When the client calls `deleteProperty`
Then the response contains the deleted property.

### AC-DELETE-2

Source: plan 5, plan 7, Errors
Given a property id that does not exist
When the client calls `deleteProperty`
Then the operation fails with `PROPERTY_NOT_FOUND`.

### AC-DELETE-3

Source: plan 10, `/` route
Given the user chooses to delete a property from the list
When deletion is requested
Then a confirmation dialog appears before deletion.

### AC-DELETE-4

Source: plan 10, `/properties/:id` route
Given the user confirms deletion from a detail page
When deletion succeeds
Then the app returns to the list.

## WEATHER

### AC-WEATHER-1

Source: plan 7, Create step 3; plan 8, Request
Given a valid property address
When `PropertyService.create` requests weather
Then the provider makes one request using the zip code as its query.

### AC-WEATHER-2

Source: plan 8, Response parsing
Given a successful Weatherstack response with string latitude and longitude
When the adapter parses it
Then it returns finite numeric coordinates.

### AC-WEATHER-3

Source: plan 8, HTTP 200 with `success: false`
Given an HTTP 200 response with `success: false`
When the adapter handles the response
Then it treats the response as a failure.

### AC-WEATHER-4

Source: plan 8, Mapping
Given Weatherstack error code 615
When the adapter maps the response
Then it raises `LOCATION_NOT_FOUND`.

### AC-WEATHER-5

Source: plan 8, Mapping
Given Weatherstack error code 101, 104, 105, 106 or any other code
When the adapter maps the response
Then it raises `WEATHER_UNAVAILABLE`.

### AC-WEATHER-6

Source: plan 8, Mapping and fixtures
Given a timeout, network failure, non-2xx response, unreadable body, missing location or unexpected response body
When the adapter handles the failure
Then it raises `WEATHER_UNAVAILABLE`.

### AC-WEATHER-7

Source: plan 8, Key handling
Given a marker API key
When the adapter handles success or any failure
Then the marker appears in no log line and in no error.

### AC-WEATHER-8

Source: plan 8, Response parsing
Given a Weatherstack response whose `current` object contains unknown keys
When the adapter parses and stores the weather data
Then those keys are kept.

### AC-WEATHER-9

Source: plan 5, plan 7, Create steps 3-5; plan 8, Fixtures
Given create, list, detail and delete operations
When the provider call count is measured
Then create makes exactly one provider call and list, detail and delete make zero calls.

### AC-WEATHER-10

Source: plan 7, Create step 5
Given the weather call fails during create
When the service handles the failure
Then it does not retry the call.

### AC-WEATHER-11

Source: plan 7, Create steps 4-5
Given the weather call fails during create
When the operation completes
Then no property is stored.

### AC-WEATHER-12

Source: plan 8, Fixtures
Given a test, development loop or CI job exercises weather retrieval
When it makes a weather request
Then it does not call the real Weatherstack API.

## ERROR

### AC-ERROR-1

Source: plan 7, Errors
Given Zod rejects mutation input or a filter
When the API returns the error
Then its code is `BAD_USER_INPUT` and `extensions.fieldErrors` is an array of objects with `field` and `message`.

### AC-ERROR-2

Source: plan 7, Errors
Given `deleteProperty` receives an unknown id
When the API returns the error
Then its code is `PROPERTY_NOT_FOUND`.

### AC-ERROR-3

Source: plan 7, Errors; plan 8, Mapping
Given Weatherstack cannot find the location
When the API returns the error
Then its code is `LOCATION_NOT_FOUND`.

### AC-ERROR-4

Source: plan 7, Errors; plan 8, Mapping
Given Weatherstack is unavailable
When the API returns the error
Then its code is `WEATHER_UNAVAILABLE` and the failure reason is available to the server log.

### AC-ERROR-5

Source: plan 7, Errors
Given an unexpected server error
When Yoga returns the error to the client
Then it is masked as `INTERNAL_SERVER_ERROR` with no stack trace and is logged on the server.

## User story coverage

| User story                            | GraphQL criteria                                                                                                                                                                                                                                                                                                       | UI criteria                                                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1. Query all properties               | AC-LIST-1, AC-WEATHER-9                                                                                                                                                                                                                                                                                                | AC-LIST-2, AC-LIST-3, AC-LIST-4, AC-LIST-5                                                                   |
| 2. Sort properties by creation date   | AC-SORT-1, AC-SORT-2, AC-SORT-3                                                                                                                                                                                                                                                                                        | AC-SORT-4                                                                                                    |
| 3. Filter by city, zip code and state | AC-FILTER-1, AC-FILTER-2, AC-FILTER-3, AC-FILTER-4, AC-FILTER-5, AC-FILTER-6                                                                                                                                                                                                                                           | AC-FILTER-7, AC-FILTER-8                                                                                     |
| 4. Query details of one property      | AC-DETAIL-1, AC-DETAIL-2                                                                                                                                                                                                                                                                                               | AC-DETAIL-3, AC-DETAIL-4, AC-DETAIL-5                                                                        |
| 5. Add a property                     | AC-CREATE-1, AC-CREATE-2, AC-CREATE-3, AC-CREATE-4, AC-CREATE-5, AC-CREATE-6, AC-CREATE-7, AC-CREATE-16, AC-CREATE-17, AC-WEATHER-1, AC-WEATHER-2, AC-WEATHER-3, AC-WEATHER-4, AC-WEATHER-5, AC-WEATHER-6, AC-WEATHER-7, AC-WEATHER-8, AC-WEATHER-10, AC-WEATHER-11, AC-WEATHER-12, AC-ERROR-1, AC-ERROR-3, AC-ERROR-4 | AC-CREATE-8, AC-CREATE-9, AC-CREATE-10, AC-CREATE-11, AC-CREATE-12, AC-CREATE-13, AC-CREATE-14, AC-CREATE-15 |
| 6. Delete a property                  | AC-DELETE-1, AC-DELETE-2, AC-WEATHER-9                                                                                                                                                                                                                                                                                 | AC-DELETE-3, AC-DELETE-4                                                                                     |
