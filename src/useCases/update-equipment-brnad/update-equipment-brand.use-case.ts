import { EquipmentBrand } from '../../db/entities/equipment-brand'
import { EquipmentBrandRepository } from '../../repository/equipment-brand/equipment-brand.repository'
import { EquipmentBrandDuplicateError } from '../create-equipment-brand/create-equipment-brand.use-case'
import { UseCase, UseCaseReponse } from '../protocol/useCase'

export class EquipmentBrandUpdateError extends Error {
  constructor() {
    super('Erro ao atualizar marca')
    this.name = 'EquipmentBrandUpdateError'
  }
}
export type UpdateDataEquipmentBrand = {
  id: number
  name: string
}

export class UpdateEquipmentBrandUseCase
  implements UseCase<UpdateDataEquipmentBrand, void>
{
  public constructor(
    private readonly brandRepository: EquipmentBrandRepository
  ) {}

  public async execute(
    data: UpdateDataEquipmentBrand
  ): Promise<UseCaseReponse<void>> {
    const possibleBrand = await this.brandRepository.findByName(data.name)
    if (possibleBrand) {
      return { isSuccess: false, error: new EquipmentBrandDuplicateError() }
    }

    const brand = new EquipmentBrand()
    brand.id = data.id
    brand.name = data.name

    return await this.brandRepository
      .update(brand)
      .then((it) => {
        return { isSuccess: true, data: it }
      })
      .catch(() => {
        return { isSuccess: false, error: new EquipmentBrandUpdateError() }
      })
  }
}
