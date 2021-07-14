import { Contract, ContractInterface } from 'ethers'

export const contracts = new Map<string, Contract>()
export function getContract(
  address: string,
  abi: ContractInterface,
  signer: any
): Contract {
  let contract = contracts.get(address)
  if (contract) {
    return contract
  }
  contract = new Contract(address, abi, signer)
  contracts.set(address, contract)
  return contract
}
