import { Status } from '../../domain/entities/equipamentEnum/status'
import { Status as OStatus } from '../../domain/entities/serviceOrderEnum/status'
import { History } from '../../domain/entities/history'
import { OrderService } from '../../domain/entities/order-service'
import { UpdateEquipmentRepository } from '../../repository/equipment/update-equipment'
import { CreateHistoryRepository } from '../../repository/history/create-history-repository'
import { CreateOrderServiceRepository } from '../../repository/order-service/create-order-service'
import { ListOneEquipmentRepository } from './../../repository/equipment/list-one-equipment'
import { UseCase } from './../protocol/useCase'
import {
  EquipmentNotFoundError,
  InvalidAuthorError,
  InvalidSenderError,
  CreateOrderServiceError
} from './errors'

export type CreateOrderServiceUseCaseData = {
  equipmentId: string
  authorId: string
  seiProcess: string
  description: string
  senderName: string
  senderDocument: string
  senderPhone: string
}

export class CreateOrderServiceUseCase
  implements UseCase<CreateOrderServiceUseCaseData, OrderService>
{
  public history: null | History = null

  constructor(
    private readonly equipmentRepository: ListOneEquipmentRepository,
    private readonly updateEquipmentRepository: UpdateEquipmentRepository,
    private readonly historyRepository: CreateHistoryRepository,
    private readonly createOrderServiceRepository: CreateOrderServiceRepository
  ) {}

  async execute(data: CreateOrderServiceUseCaseData) {
    if (!data.authorId) {
      return {
        isSuccess: false,
        error: new InvalidAuthorError()
      }
    }

    if (!data.senderName || !data.senderDocument) {
      return {
        isSuccess: false,
        error: new InvalidSenderError()
      }
    }

    const equipment = await this.equipmentRepository.listOne(data.equipmentId)

    if (equipment === undefined) {
      return {
        isSuccess: false,
        error: new EquipmentNotFoundError()
      }
    }

    if (equipment.situacao === Status.MAINTENANCE) {
      return {
        isSuccess: false,
        error: new CreateOrderServiceError()
      }
    }

    if (!equipment.history) {
      this.history = await this.historyRepository.create({
        equipment,
        equipmentSnapshot: equipment
      })
    } else this.history = equipment.history

    if (this.history !== null) {
      const orderService = await this.createOrderServiceRepository.create({
        equipment,
        authorId: data.authorId,
        seiProcess: data.seiProcess,
        description: data.description,
        senderName: data.senderName,
        senderDocument: data.senderDocument,
        senderPhone: data.senderPhone,
        status: 'MAINTENANCE' as OStatus
      })

      await this.updateEquipmentRepository.updateEquipment(equipment.id, {
        situacao: Status.MAINTENANCE
      })

      return {
        isSuccess: true,
        data: orderService
      }
    } else
      return {
        isSuccess: false,
        error: new CreateOrderServiceError()
      }
  }
}
