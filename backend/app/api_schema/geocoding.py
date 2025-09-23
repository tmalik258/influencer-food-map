from pydantic import BaseModel


class GeocodeRequest(BaseModel):
    address: str
    city: str
    country: str


class GeocodeResponse(BaseModel):
    latitude: float
    longitude: float
    formatted_address: str