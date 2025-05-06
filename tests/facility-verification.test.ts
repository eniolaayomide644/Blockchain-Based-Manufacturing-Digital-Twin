import { describe, it, expect, beforeEach } from 'vitest';

// Mock the Clarity contract environment
const mockContractEnv = () => {
  const state = {
    facilities: new Map(),
    admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Mock admin address
    txSender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Default sender
  };
  
  return {
    state,
    setTxSender: (address) => {
      state.txSender = address;
    },
    registerFacility: (facilityId, name, location) => {
      if (state.facilities.has(facilityId)) {
        return { err: 1 };
      }
      
      state.facilities.set(facilityId, {
        name,
        location,
        verified: false,
        verificationDate: 0,
        owner: state.txSender
      });
      
      return { ok: true };
    },
    verifyFacility: (facilityId) => {
      if (state.txSender !== state.admin) {
        return { err: 3 }; // Not authorized
      }
      
      if (!state.facilities.has(facilityId)) {
        return { err: 2 }; // Facility not found
      }
      
      const facility = state.facilities.get(facilityId);
      facility.verified = true;
      facility.verificationDate = 100; // Mock block height
      state.facilities.set(facilityId, facility);
      
      return { ok: true };
    },
    isFacilityVerified: (facilityId) => {
      if (!state.facilities.has(facilityId)) {
        return { err: 2 }; // Facility not found
      }
      
      return { ok: state.facilities.get(facilityId).verified };
    },
    getFacility: (facilityId) => {
      return state.facilities.get(facilityId) || null;
    },
    transferFacility: (facilityId, newOwner) => {
      if (!state.facilities.has(facilityId)) {
        return { err: 2 }; // Facility not found
      }
      
      const facility = state.facilities.get(facilityId);
      if (facility.owner !== state.txSender) {
        return { err: 4 }; // Not the owner
      }
      
      facility.owner = newOwner;
      state.facilities.set(facilityId, facility);
      
      return { ok: true };
    }
  };
};

describe('Facility Verification Contract', () => {
  let contract;
  
  beforeEach(() => {
    contract = mockContractEnv();
  });
  
  it('should register a new facility', () => {
    const result = contract.registerFacility('facility1', 'Test Facility', 'New York');
    expect(result).toEqual({ ok: true });
    
    const facility = contract.getFacility('facility1');
    expect(facility).toEqual({
      name: 'Test Facility',
      location: 'New York',
      verified: false,
      verificationDate: 0,
      owner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    });
  });
  
  it('should not register a facility with an existing ID', () => {
    contract.registerFacility('facility1', 'Test Facility', 'New York');
    const result = contract.registerFacility('facility1', 'Another Facility', 'Boston');
    expect(result).toEqual({ err: 1 });
  });
  
  it('should verify a facility when called by admin', () => {
    contract.registerFacility('facility1', 'Test Facility', 'New York');
    const result = contract.verifyFacility('facility1');
    expect(result).toEqual({ ok: true });
    
    const facility = contract.getFacility('facility1');
    expect(facility.verified).toBe(true);
  });
  
  it('should not verify a facility when called by non-admin', () => {
    contract.registerFacility('facility1', 'Test Facility', 'New York');
    contract.setTxSender('ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'); // Different address
    const result = contract.verifyFacility('facility1');
    expect(result).toEqual({ err: 3 });
  });
  
  it('should check if a facility is verified', () => {
    contract.registerFacility('facility1', 'Test Facility', 'New York');
    let result = contract.isFacilityVerified('facility1');
    expect(result).toEqual({ ok: false });
    
    contract.verifyFacility('facility1');
    result = contract.isFacilityVerified('facility1');
    expect(result).toEqual({ ok: true });
  });
  
  it('should transfer facility ownership', () => {
    contract.registerFacility('facility1', 'Test Facility', 'New York');
    const newOwner = 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const result = contract.transferFacility('facility1', newOwner);
    expect(result).toEqual({ ok: true });
    
    const facility = contract.getFacility('facility1');
    expect(facility.owner).toBe(newOwner);
  });
  
  it('should not transfer facility if not the owner', () => {
    contract.registerFacility('facility1', 'Test Facility', 'New York');
    contract.setTxSender('ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'); // Different address
    const result = contract.transferFacility('facility1', 'ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    expect(result).toEqual({ err: 4 });
  });
});
