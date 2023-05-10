/* eslint-disable prettier/prettier */
import { Status } from '../../domain/entities/equipamentEnum/status'
import { Status as OSStatus } from '../../domain/entities/serviceOrderEnum/status'
import { History } from '../../domain/entities/history'
import { OrderService } from '../../domain/entities/order-service'
import {
  UpdateEquipmentRepository
} from '../../repository/equipment/update-equipment'
import { CreateHistoryRepository } from '../../repository/history/create-history-repository'
import { ListOneUnitRepository } from '../../repository/unit/list-one-unit'
import { ListOneEquipmentRepository } from './../../repository/equipment/list-one-equipment'
import { UseCase } from './../protocol/useCase'
import { UpdateOrderServiceRepository } from '../../repository/order-service/update-order-service-repository'
import { ListOrderServiceRepository } from '../../repository/order-service/list-order-service'
import {
  EquipmentNotFoundError,
  InvalidAuthorError,
  InvalidSenderError,
  UpdateOrderServiceError,
  InvalidDateError
} from '../create-order-service/errors'

export type UpdateOrderServiceUseCaseData = {
  id: string
  equipmentId: string
  description: string
  authorId: string
  receiverName: string
  authorFunctionalNumber: string
  senderName: string
  senderFunctionalNumber: string
  date: string
  reciverFunctionalNumber: string
  status: string
  techinicias: []
  receiverDate: string
}

export class UpdateOrderServiceUseCase
  implements UseCase<UpdateOrderServiceUseCaseData, OrderService>
{
  public history: null | History = null

  constructor(
    private readonly equipmentRepository: ListOneEquipmentRepository,
    private readonly updateEquipmentRepository: UpdateEquipmentRepository,
    private readonly unitRepository: ListOneUnitRepository,
    private readonly historyRepository: CreateHistoryRepository,
    private readonly updateOrderServiceRepository: UpdateOrderServiceRepository,
    private readonly listOrderServiceRepository: ListOrderServiceRepository
  ) {}

  async execute(
    data: UpdateOrderServiceUseCaseData
  ){
    if (!data.authorFunctionalNumber || !data.receiverName) {
      return {
        isSuccess: false,
        error: new InvalidAuthorError()
      }
    }

    if (!data.date || !Date.parse(data.date)) {
      return {
        isSuccess: false,
        error: new InvalidDateError()
      }
    }

    if (!data.senderName || !data.senderFunctionalNumber) {
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

    if (!equipment.history) {
      this.history = await this.historyRepository.create({
        equipment,
        equipmentSnapshot: equipment
      })
    } else this.history = equipment.history

    if (this.history !== null) {
      await this.updateOrderServiceRepository.updateOrderSevice(data.id, {
        authorId: data.authorId,
        receiverName: data.receiverName,
        authorFunctionalNumber: data.authorFunctionalNumber,
        description: data.description,
        equipment,
        history: this.history,
        equipmentSnapshot: equipment,
        senderName: data.senderName,
        senderFunctionalNumber: data.senderFunctionalNumber,
        date: new Date(data.date),
        receiverFunctionalNumber: data.reciverFunctionalNumber,
        status: data.status.toUpperCase() as OSStatus,
        technicians: data.techinicias,
        receiverDate: new Date(data.receiverDate)
      })

      if (
        this.handleOSStatus(data.status) === OSStatus.CONCLUDED ||
        this.handleOSStatus(data.status) === OSStatus.CANCELED
      ) {
        await this.updateEquipmentRepository.updateEquipment(equipment.id, {
          situacao: Status.ACTIVE
        })
      } else {
        await this.updateEquipmentRepository.updateEquipment(equipment.id, {
          situacao: Status.MAINTENANCE
        })
      }

      return {
        isSuccess: true
      }
    } else
      return {
        isSuccess: false,
        error: new UpdateOrderServiceError()
      }
  }

  private handleOSStatus(status: string): OSStatus {
    switch (status.toUpperCase()) {
      case 'MAINTENANCE': {
        return OSStatus.MAINTENANCE
      }
      case 'WARRANTY': {
        return OSStatus.WARRANTY
      }
      case 'CONCLUDED': {
        return OSStatus.CONCLUDED
      }
      case 'CANCELED': {
        return OSStatus.CANCELED
      }
    }
  }
}
