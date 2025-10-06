// Serviço para calcular distância entre CEPs usando APIs gratuitas

interface Coordinates {
  lat: number;
  lon: number;
}

interface CepData {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
  location?: {
    type: string;
    coordinates: {
      latitude?: string;
      longitude?: string;
    };
  };
}

/**
 * Busca as coordenadas de um CEP usando BrasilAPI
 */
async function getCoordinatesByCep(cep: string): Promise<Coordinates | null> {
  try {
    const cleanCep = cep.replace(/\D/g, '');
    console.log('getCoordinatesByCep - CEP limpo:', cleanCep);

    if (cleanCep.length !== 8) {
      console.error('CEP inválido');
      return null;
    }

    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
    console.log('getCoordinatesByCep - Response status:', response.status);

    if (!response.ok) {
      throw new Error('CEP não encontrado');
    }

    const data: CepData = await response.json();
    console.log('getCoordinatesByCep - Dados recebidos:', data);

    if (data.location?.coordinates?.latitude && data.location?.coordinates?.longitude) {
      const coords = {
        lat: parseFloat(data.location.coordinates.latitude),
        lon: parseFloat(data.location.coordinates.longitude)
      };
      console.log('getCoordinatesByCep - Coordenadas encontradas:', coords);
      return coords;
    }

    // Fallback: buscar coordenadas usando cidade + UF se location não estiver disponível
    console.log('getCoordinatesByCep - Location não disponível, usando fallback para:', `${data.city}, ${data.state}`);
    return await getCoordinatesByCityName(`${data.city}, ${data.state}`);
  } catch (error) {
    console.error(`Erro ao buscar coordenadas para o CEP ${cep}:`, error);
    return null;
  }
}

/**
 * Busca as coordenadas de uma cidade usando Nominatim (OpenStreetMap) - Fallback
 */
async function getCoordinatesByCityName(cityName: string): Promise<Coordinates | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)},Brasil&limit=1`;
    console.log('getCoordinatesByCityName - URL:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OLogX-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar coordenadas');
    }

    const data = await response.json();
    console.log('getCoordinatesByCityName - Resposta:', data);

    if (data && data.length > 0) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
      console.log('getCoordinatesByCityName - Coordenadas encontradas:', coords);
      return coords;
    }

    console.log('getCoordinatesByCityName - Nenhuma coordenada encontrada');
    return null;
  } catch (error) {
    console.error(`Erro ao buscar coordenadas para ${cityName}:`, error);
    return null;
  }
}

/**
 * Calcula a distância entre dois pontos usando a fórmula de Haversine
 */
function calculateHaversineDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lon - coord1.lon);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance); // Retorna em km arredondado
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calcula a distância entre dois CEPs brasileiros
 * @param originCep CEP de origem
 * @param destinationCep CEP de destino
 * @returns Distância em km ou null se não conseguir calcular
 */
export async function calculateDistanceByCep(originCep: string, destinationCep: string): Promise<number | null> {
  if (!originCep || !destinationCep) {
    return null;
  }

  try {
    // Buscar coordenadas de origem e destino
    const [originCoords, destCoords] = await Promise.all([
      getCoordinatesByCep(originCep),
      getCoordinatesByCep(destinationCep)
    ]);

    if (!originCoords || !destCoords) {
      console.error('Não foi possível obter coordenadas para um ou ambos os CEPs');
      return null;
    }

    // Calcular distância usando Haversine
    const distance = calculateHaversineDistance(originCoords, destCoords);

    return distance;
  } catch (error) {
    console.error('Erro ao calcular distância:', error);
    return null;
  }
}

/**
 * Calcula a distância entre duas cidades brasileiras (mantido para compatibilidade)
 * @param origin Nome da cidade de origem
 * @param destination Nome da cidade de destino
 * @returns Distância em km ou null se não conseguir calcular
 */
export async function calculateDistance(origin: string, destination: string): Promise<number | null> {
  if (!origin || !destination) {
    return null;
  }

  try {
    // Buscar coordenadas de origem e destino
    const [originCoords, destCoords] = await Promise.all([
      getCoordinatesByCityName(origin),
      getCoordinatesByCityName(destination)
    ]);

    if (!originCoords || !destCoords) {
      console.error('Não foi possível obter coordenadas para uma ou ambas as cidades');
      return null;
    }

    // Calcular distância usando Haversine
    const distance = calculateHaversineDistance(originCoords, destCoords);

    return distance;
  } catch (error) {
    console.error('Erro ao calcular distância:', error);
    return null;
  }
}
