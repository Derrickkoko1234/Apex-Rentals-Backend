export enum PropertyTypes {
  CONDO = "Condo",
  APARTMENT = "Apartment",
  HOUSE = "House",
  ROOM = "Room",
}

export const PropertySubTypes = {
  CONDO: ["High-rise", "Low-rise", "Loft"],
  APARTMENT: ["Studio", "1-bedroom", "2-bedroom", "Penthouse"],
  HOUSE: ["Detached", "Semi-detached", "Townhouse", "Bungalow"],
  ROOM: ["Single", "Shared"],
};

export const allPropertySubTypes = [
  ...PropertySubTypes.CONDO,
  ...PropertySubTypes.APARTMENT,
  ...PropertySubTypes.HOUSE,
  ...PropertySubTypes.ROOM,
];

export enum Utilities {
  WATER = "Water",
  ELECTRICITY = "Electricity",
  GAS = "Gas",
  INTERNET = "Internet",
  PARKING = "Parking",
  FURNISHED = "Furnished",
  AIR_CONDITIONING = "Air Conditioning",
  HEATING = "Heating",
  LAUNDRY = "Laundry",
  GYM = "Gym",
  POOL = "Pool",
  PETS_ALLOWED = "Pets Allowed",
}

export enum Category {
  CORPORATE_HOUSING = "Corporate Housing",
  STUDENT_HOUSING = "Student Housing",
  SENIOR_HOUSING = "Senior Housing",
  COOP_HOUSING = "Co-op Housing",
  SUBLET = "Sublet",
  VACATION = "Vacation",
}
