import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PatientDto } from 'src/dto/patient.dto';
import { UpdatePatientDto } from 'src/dto/update-patient.dto';
import { Patient } from 'src/schema/patient.schema';
import { Types } from 'mongoose';
import { toTitleCase } from 'src/shared/functions/commonFunctions';
import { Prescription } from 'src/schema/prescriptions.schema';
import { Invoice } from 'src/schema/invoice.schema';


@Injectable()
export class PatientService {
    private readonly logger = new Logger(PatientService.name);

    constructor(
        @InjectModel('Patient') private patientModel: Model<Patient>,
        @InjectModel('Clinic') private clinicModel: Model<any>,
        @InjectModel('Prescription') private prescriptionModel: Model<Prescription>,
        @InjectModel('Invoice') private invoiceModel: Model<Invoice>,
    ) {
    }
    async createPatient(patientData: PatientDto): Promise<any> {
    const clinicId = new Types.ObjectId(patientData.clinicId);

    try {

        // Check duplicate phone number
        const checkPhoneNumberIsPresent = await this.patientModel.findOne({
            phoneNumber: patientData.phoneNumber,
            clinicId: clinicId,
            delete_status: { $ne: true },
        });

        if (checkPhoneNumberIsPresent) {
            return {
                status: HttpStatus.CONFLICT,
                message: 'Phone number already exists for this clinic',
                error: 'Phone number already in use for this clinic'
            };
        }

        /**
         * STEP 1: GET CLINIC DETAILS
         */
        const clinic = await this.clinicModel.findById(clinicId);

        if (!clinic) {
            return {
                status: HttpStatus.NOT_FOUND,
                message: 'Clinic not found',
                error: 'Invalid clinic'
            };
        }

        /**
         * STEP 2: GENERATE PREFIX
         * Example:
         * HealSync => HEA
         */
        const clinicPrefix = clinic.name
            .replace(/[^a-zA-Z]/g, '')
            .substring(0, 3)
            .toUpperCase();

        /**
         * STEP 3: GET CURRENT YEAR
         */
        const currentYear = new Date().getFullYear();

        /**
         * STEP 4: FIND LAST PATIENT OF THIS YEAR
         */
        const lastPatient = await this.patientModel
            .findOne({
                clinicId: clinicId,
                uhid: {
                    $regex: `^${clinicPrefix}-${currentYear}`
                }
            })
            .sort({ createdAt: -1 });

        /**
         * STEP 5: GENERATE NEXT SEQUENCE
         */
        let nextSequence = 1;

        if (lastPatient && lastPatient.uhid) {

            // Example UHID:
            // HEA-2026-000015

            const splitUHID = lastPatient.uhid.split('-');

            const lastSequence = parseInt(splitUHID[2]);

            nextSequence = lastSequence + 1;
        }

        /**
         * STEP 6: FORMAT SEQUENCE
         */
        const formattedSequence = String(nextSequence).padStart(6, '0');

        /**
         * FINAL UHID
         * Example:
         * HEA-2026-000001
         */
        const uhid = `${clinicPrefix}-${currentYear}-${formattedSequence}`;

        /**
         * CREATE PATIENT
         */
        const newPatient = new this.patientModel({
            ...patientData,
            name: toTitleCase(patientData.name),
            uhid: uhid
        });

        const data = await newPatient.save();
        this.logger.log('Patient created successfully');

        if (!data) {
            return {
                status: HttpStatus.BAD_REQUEST,
                message: 'Patient Failed to create',
                error: 'Failed to create patient'
            };
        }

        return {
            status: HttpStatus.CREATED,
            message: 'Patient created successfully',
            data: data,
            error: null
        };

    } catch (error) {

        this.logger.error('Error creating patient', error instanceof Error ? error.stack : String(error));

        throw new HttpException(
            {
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Something went wrong'
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
            { cause: error }
        );
    }
}

    async getPatient(search: { name?: string; clinicId?: string }): Promise<any> {
        try {
            const query: any = { delete_status: { $ne: true } };
            
            // Add name search if provided
            if (search.name) {
                const escapedName = search.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                query.name = { $regex: escapedName, $options: 'i' };
            }
              // Add clinicId filter if provided
            const clinicId = search.clinicId ? new Types.ObjectId(search.clinicId) : null;
            if (search.clinicId) {
                query.clinicId = clinicId;
            }
            
            const data = await this.patientModel.find(query)
                .limit(5)
                .exec();
            
            if (data.length === 0) {
                this.logger.debug('No patients found matching the search criteria');
                return {
                    status: HttpStatus.NOT_FOUND,
                    message: 'No patients found',
                    data: [],
                    error: null
                };
            }
            return {
                status: HttpStatus.OK,
                message: 'Patients retrieved successfully',
                data: data,
                error: null
            };
        } catch (error) {
            this.logger.error('Error retrieving patients', error instanceof Error ? error.stack : String(error));
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error instanceof Error ? error.message : 'Something went wrong'
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getSinglePatient(id: string): Promise<any> {
        try {
            const patientId= new Types.ObjectId(id)
            const data = await this.patientModel.findOne({
                _id: patientId,
                delete_status: { $ne: true },
            });
            if (!data) {
                return {
                    status: HttpStatus.NOT_FOUND,
                    message: 'Patient not found',
                    data: null,
                    error: 'No patient found with the given ID'
                };
            }
            this.logger.log('Retrieved patient successfully');

            return {
                status: HttpStatus.OK,
                message: 'Patient retrieved successfully',
                data: data,
                error: null
            };
        } catch (error) {
            this.logger.error('Error retrieving patient', error instanceof Error ? error.stack : String(error));
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error instanceof Error ? error.message : 'Something went wrong'
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    async updatePatient(id: string, updatePatientData: UpdatePatientDto): Promise<any> {
        // Logic to update an existing patient
        try {
            const patient = await this.patientModel.findOne({
                _id: id,
                delete_status: { $ne: true },
            });

            if (!patient) {
                return {
                    status: HttpStatus.NOT_FOUND,
                    message: 'Patient not found',
                    data: null,
                    error: 'No patient found with the given ID'
                };
            }

            // If phoneNumber is being updated, check for duplicates
            if (updatePatientData.phoneNumber && updatePatientData.phoneNumber !== patient.phoneNumber) {
                const existingPatient = await this.patientModel.findOne({
                    phoneNumber: updatePatientData.phoneNumber,
                    clinicId: patient.clinicId,
                    _id: { $ne: id }
                });

                if (existingPatient) {
                    return {
                        status: HttpStatus.CONFLICT,
                        message: 'Phone number already exists for this doctor',
                        error: 'Phone number already in use for this doctor'
                    };
                }
            }

            const updatedPatient = await this.patientModel.findByIdAndUpdate(
                id,
                updatePatientData,
                { new: true, runValidators: true }
            );

            if (!updatedPatient) {
                return {
                    status: HttpStatus.BAD_REQUEST,
                    message: 'Patient failed to update',
                    error: 'Failed to update patient'
                };
            }

            return {
                status: HttpStatus.OK,
                message: 'Patient updated successfully',
                data: updatedPatient,
                error: null
            };
        } catch (error) {
            this.logger.error('Error updating patient', error instanceof Error ? error.stack : String(error));
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Something went wrong'
            }, HttpStatus.INTERNAL_SERVER_ERROR, { cause: error });
        }
    }
    async deletePatient(id: string): Promise<any> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid patient ID');
        }

        const patientId = new Types.ObjectId(id);
        const patient = await this.patientModel.findOne({
            _id: patientId,
            delete_status: { $ne: true },
        });

        if (!patient) {
            throw new NotFoundException('Patient not found');
        }

        try {
            const deletedAt = new Date();
            const relatedRecordsExpiresAt = new Date(deletedAt.getTime() + 60_000);
            await Promise.all([
                this.prescriptionModel.updateMany(
                    { patient: patientId, delete_status: { $ne: true } },
                    { $set: { delete_status: true, deletedAt, expiresAt: relatedRecordsExpiresAt } },
                ).exec(),
                this.invoiceModel.updateMany(
                    { patientId, delete_status: { $ne: true } },
                    { $set: { delete_status: true, deletedAt, expiresAt: relatedRecordsExpiresAt } },
                ).exec(),
            ]);

            const patientExpiresAt = new Date(deletedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
            const deletedPatient = await this.patientModel.findOneAndUpdate(
                { _id: patientId, delete_status: { $ne: true } },
                { $set: { delete_status: true, deletedAt, expiresAt: patientExpiresAt } },
                { new: true },
            ).exec();

            if (!deletedPatient) {
                throw new NotFoundException('Patient not found');
            }

            this.logger.log(`Patient and related records deleted: ${id}`);
            return {
                status: HttpStatus.OK,
                message: 'Patient, prescriptions, and invoices deleted successfully',
                data: deletedPatient,
                error: null,
            };
        } catch (error) {
            this.logger.error('Error deleting patient and related records', error instanceof Error ? error.stack : String(error));
            throw error;
        }
    }
}
