export const toOnfidoDataTypes = ({givenNames, familyName, countryOfResidence, postalAddress, nationality, email}) => {
  return {
    first_name: givenNames,
    last_name: familyName,
    postal_address: postalAddress,
    nationality: nationality.value,
    country: countryOfResidence.value,
    email
  }
}
