import { EquipmentAcquisition } from '../../db/entities/equipment-acquisition'
import { EquipmentBrand } from '../../db/entities/equipment-brand'
import { Unit } from '../../db/entities/unit'

import { ScreenType } from '../../domain/entities/equipamentEnum/screenType'
import { Status } from '../../domain/entities/equipamentEnum/status'
import { Estado } from '../../domain/entities/equipamentEnum/estado'
import { StorageType } from '../../domain/entities/equipamentEnum/storageType'
import { Equipment } from '../../domain/entities/equipment'
import AcquisitionRepositoryProtocol from '../../repository/protocol/acquisitionRepositoryProtocol'
import { EquipmentRepositoryProtocol } from '../../repository/protocol/equipmentRepositoryProtocol'
import { UnitRepositoryProtocol } from '../../repository/protocol/unitRepositoryProtocol'
import { UseCase, UseCaseReponse } from '../protocol/useCase'
import { Equipment as EquipmentEntity } from '../../db/entities/equipment'
import { EquipmentBrandRepository } from '../../repository/equipment-brand/equipment-brand.repository'
import { EquipmentTypeRepository } from '../../repository/equipment-type/equipment-type.repository'

export interface CreateEquipmentInterface {
  tippingNumber: string

  serialNumber: string

  type: string

  situacao: string

  estado: string

  model: string

  description?: string

  acquisitionDate: Date

  screenSize?: string

  power?: string

  screenType?: string

  processor?: string

  storageType?: string

  storageAmount?: string

  brandName: string

  acquisitionName: string

  unitId: string

  ram_size?: string
}

export interface EquipmentResource {
  id: string

  tippingNumber: string

  serialNumber: string

  type: string

  situacao: string

  estado: string

  model: string

  description?: string

  acquisitionDate: Date

  screenSize?: string

  power?: string

  screenType?: string

  processor?: string

  storageType?: string

  storageAmount?: string

  brand: EquipmentBrand

  acquisition: EquipmentAcquisition

  unit: Unit

  ram_size?: string
}

export class EquipmentTypeError extends Error {
  constructor() {
    super('Tipo de equipamento não encontrado.')
    this.name = 'EquipmentTypeError'
  }
}

export class NotFoundUnit extends Error {
  constructor() {
    super('Não encontrada unidade.')
    this.name = 'NotFoundUnit'
  }
}
export class NullFields extends Error {
  constructor() {
    super('Campos nulos ou vazios.')
    this.name = 'NullFields'
  }
}
export class InvalidTippingNumber extends Error {
  constructor() {
    super(
      'Tippingnumber nao pode ser igual ao de um equipamento ja cadastrado.'
    )
    this.name = 'InvalidTippingNumber'
  }
}

export class InvalidEquipmentBrand extends Error {
  constructor() {
    super('Marca de equipamento invalida')
    this.name = 'InvalidEquipmentBrand'
  }
}

export class InvalidEquipmentType extends Error {
  constructor() {
    super('Tipo de equipamento invalida')
    this.name = 'InvalidEquipmentType'
  }
}

export class CreateEquipmentUseCase
  implements UseCase<CreateEquipmentInterface, Equipment>
{
  constructor(
    private readonly equipmentRepository: EquipmentRepositoryProtocol,
    private readonly unitRepository: UnitRepositoryProtocol,
    private readonly brandRepository: EquipmentBrandRepository,
    private readonly acquisitionRepository: AcquisitionRepositoryProtocol,
    private readonly typeRepository: EquipmentTypeRepository
  ) {}

  private validFixedFields(equipmentData: CreateEquipmentInterface): boolean {
    if (
      equipmentData.tippingNumber.trim().length > 0 &&
      equipmentData.serialNumber.trim().length > 0 &&
      equipmentData.model.trim().length > 0 &&
      equipmentData.type.trim().length > 0 &&
      equipmentData.estado.trim().length > 0
    ) {
      return true
    } else {
      return false
    }
  }

  private validCpuFields(equipmentData: CreateEquipmentInterface): boolean {
    if (
      !equipmentData.processor ||
      !equipmentData.storageAmount ||
      !equipmentData.storageType ||
      !equipmentData.ram_size
    ) {
      return false
    } else {
      return true
    }
  }

  private validMonitorFields(equipmentData: CreateEquipmentInterface): boolean {
    if (!equipmentData.screenType || !equipmentData.screenSize) {
      return false
    } else {
      if (
        equipmentData.screenType !== ScreenType.IPS &&
        equipmentData.screenType !== ScreenType.LCD &&
        equipmentData.screenType !== ScreenType.LED &&
        equipmentData.screenType !== ScreenType.OLED &&
        equipmentData.screenType !== ScreenType.TN &&
        equipmentData.screenType !== ScreenType.VA
      ) {
        return false
      }

      return true
    }
  }

  private validOthersFields(equipmentData: CreateEquipmentInterface): boolean {
    if (!equipmentData.power) {
      return false
    } else {
      return true
    }
  }

  private mapEquipmentToEquipmentResource(equipment: Equipment) {
    return {
      id: equipment.id,

      tippingNumber: equipment.tippingNumber,

      serialNumber: equipment.serialNumber,

      type: equipment.type,

      situacao: equipment.situacao,

      estado: equipment.estado,

      model: equipment.model,

      description: equipment.description,

      acquisitionDate: equipment.acquisitionDate,

      screenSize: equipment.screenSize,

      power: equipment.power,

      screenType: equipment.screenType,

      processor: equipment.processor,

      storageType: equipment.storageType,

      storageAmount: equipment.storageAmount,

      brand: equipment.brand,

      acquisition: equipment.acquisition,

      unit: equipment.unit,

      ram_size: equipment.ram_size,

      createdAt: equipment.createdAt,

      updatedAt: equipment.updatedAt
    }
  }

  async execute(
    equipmentData: CreateEquipmentInterface
  ): Promise<UseCaseReponse<any>> {
    const equipment = new EquipmentEntity()
    if (!this.validFixedFields(equipmentData)) {
      return {
        isSuccess: false,
        error: new NullFields()
      }
    }

    const unit = await this.unitRepository.findOne(equipmentData.unitId)
    if (!unit) {
      return {
        isSuccess: false,
        error: new NotFoundUnit()
      }
    }

    const brand = await this.brandRepository.findByName(equipmentData.brandName)
    if (!brand) {
      return {
        isSuccess: false,
        error: new InvalidEquipmentBrand()
      }
    }

    let acquisition = await this.acquisitionRepository.findOneByName(
      equipmentData.acquisitionName
    )
    if (!acquisition) {
      acquisition = await this.acquisitionRepository.create({
        name: equipmentData.acquisitionName,
        id: '',
        equipment: []
      })
    }

    const type = await this.typeRepository.findByName(equipmentData.type)
    if (!type) {
      return {
        isSuccess: false,
        error: new InvalidEquipmentType()
      }
    }

    const tippingNumber = await this.equipmentRepository.findByTippingNumber(
      equipmentData.tippingNumber
    )
    if (tippingNumber) {
      return {
        isSuccess: false,
        error: new InvalidTippingNumber()
      }
    }

    equipment.tippingNumber = equipmentData.tippingNumber
    equipment.serialNumber = equipmentData.serialNumber
    equipment.situacao =
      (equipmentData.situacao as Status) ?? ('Reserva Técnica' as Status)
    equipment.estado = equipmentData.estado as Estado
    equipment.model = equipmentData.model
    equipment.description = equipmentData.description ?? ''
    equipment.acquisitionDate = equipmentData.acquisitionDate
    equipment.type = type

    switch (type.name.toUpperCase()) {
      case 'CPU':
        if (!this.validCpuFields(equipmentData)) {
          return {
            isSuccess: false,
            error: new NullFields()
          }
        }
        equipment.processor = equipmentData.processor ?? ''
        equipment.storageAmount = equipmentData.storageAmount ?? ''
        equipment.storageType = equipmentData.storageType as StorageType
        equipment.ram_size = equipmentData.ram_size ?? ''
        break
      case 'MONITOR':
        if (!this.validMonitorFields(equipmentData)) {
          return {
            isSuccess: false,
            error: new NullFields()
          }
        }
        equipment.screenType = equipmentData.screenType as ScreenType
        equipment.screenSize = equipmentData.screenSize ?? ''
        break

      case 'NOBREAK':
        if (!this.validOthersFields(equipmentData)) {
          return {
            isSuccess: false,
            error: new NullFields()
          }
        }
        if (!equipmentData.power) {
          return {
            isSuccess: false,
            error: new NullFields()
          }
        }
        equipment.power = equipmentData.power ?? ''
        break

      case 'ESTABILIZADOR':
        if (!equipmentData.power) {
          return {
            isSuccess: false,
            error: new NullFields()
          }
        }
        equipment.power = equipmentData.power ?? ''
        break

      default:
    }
    equipment.acquisition = acquisition as unknown as EquipmentAcquisition
    equipment.unit = unit as unknown as Unit
    equipment.brand = brand as EquipmentBrand

    await this.equipmentRepository.create(equipment)

    return {
      isSuccess: true,
      data: this.mapEquipmentToEquipmentResource(equipment)
    }
  }
}
