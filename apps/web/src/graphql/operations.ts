import { graphql } from './generated/index.ts';

export const PropertiesDocument = graphql(/* GraphQL */ `
  query Properties($filter: PropertyFilter, $sort: PropertySort!) {
    properties(filter: $filter, sort: $sort) {
      id
      street
      city
      state
      zipCode
      createdAt
      weatherData {
        temperature
        weather_descriptions
      }
    }
  }
`);

export const PropertyDocument = graphql(/* GraphQL */ `
  query Property($id: ID!) {
    property(id: $id) {
      id
      street
      city
      state
      zipCode
      lat
      long
      createdAt
      weatherData {
        observation_time
        temperature
        weather_code
        weather_icons
        weather_descriptions
        wind_speed
        wind_degree
        wind_dir
        pressure
        precip
        humidity
        cloudcover
        feelslike
        uv_index
        visibility
        is_day
      }
    }
  }
`);

export const CreatePropertyDocument = graphql(/* GraphQL */ `
  mutation CreateProperty($input: CreatePropertyInput!) {
    createProperty(input: $input) {
      id
    }
  }
`);

export const DeletePropertyDocument = graphql(/* GraphQL */ `
  mutation DeleteProperty($id: ID!) {
    deleteProperty(id: $id) {
      id
    }
  }
`);
