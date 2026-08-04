/**
 * Central Dispatch Integration (Adapter Pattern)
 * 
 * Note: Since Central Dispatch doesn't have an open public API without partner 
 * approval or third-party EDI/SOAP integration, this module serves as the 
 * architecture abstraction layer. When production credentials are provided, 
 * swap the mock logic here with the actual axios/fetch calls.
 */

export interface CDLoad {
  id: string;
  origin: string;
  destination: string;
  vehicle: string;
  price: number;
  postedBy: string;
  createdAt: string;
}

/**
 * Searches for loads on Central Dispatch.
 * MOCKED for development.
 */
export async function searchCentralDispatchLoads(origin?: string, dest?: string): Promise<CDLoad[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Return mock loads based on search or random defaults
  return [
    {
      id: `CD-${Math.floor(Math.random() * 100000)}`,
      origin: origin || 'Miami, FL',
      destination: dest || 'Dallas, TX',
      vehicle: '2023 Tesla Model 3',
      price: 850.00,
      postedBy: 'ABC Auto Transport',
      createdAt: new Date().toISOString()
    },
    {
      id: `CD-${Math.floor(Math.random() * 100000)}`,
      origin: origin || 'Los Angeles, CA',
      destination: dest || 'Seattle, WA',
      vehicle: '2021 Ford F-150',
      price: 1200.00,
      postedBy: 'National Movers',
      createdAt: new Date().toISOString()
    }
  ];
}

/**
 * Posts a local AxleGrid load to Central Dispatch.
 * MOCKED for development.
 */
export async function postLoadToCentralDispatch(loadDetails: {
  originCity: string;
  destCity: string;
  price: number;
  vehiclesData: any;
}): Promise<{ success: boolean; externalId?: string; error?: string }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('[Central Dispatch] Posting Load:', loadDetails);

  // Simulate success
  return {
    success: true,
    externalId: `CD-${Math.floor(Math.random() * 100000)}`
  };
}
