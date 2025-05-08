class LocationNameModel {
  constructor({ 
    locName = "", 
    locUrl = "", 
    slug = "", 
    apartmentType = "",
    updatedAt = new Date().toISOString(), // Automatically sets current timestamp
    processed = false } = {}) {
    this.locName = locName;
    this.locUrl = locUrl;
    this.slug = slug;
    this.apartmentType = apartmentType;
    this.updatedAt = updatedAt;
    this.processed = processed;
    
    
  }

  toJson() {
    return {
      locName: this.locName,
      locUrl: this.locUrl,
      slug: this.slug,
      apartmentType: this.apartmentType,
      updatedAt: this.updatedAt,
      processed: this.processed
    };
  }

  fromJson(json) {
    this.locName = json.locName;
    this.locUrl = json.locUrl;
    this.slug = json.slug;
    this.apartmentType = json.apartmentType;
    this.updatedAt = json.updatedAt;
    this.processed = json.processed;
  }


}

export default LocationNameModel;
