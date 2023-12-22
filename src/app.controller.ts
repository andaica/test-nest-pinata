import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { Readable } from 'stream';
import config from 'src/config';

const pinataSDK = require('@pinata/sdk');

const pinata = new pinataSDK({
  pinataJWTKey: config.PINATA_JWT_KEY
});

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Check pinata connection' })
  async getHello() {
    const res = await pinata.testAuthentication();
    console.log(res);
    const isOk = res["authenticated"] ? "OK" : "N/A"
    return isOk;
  }

  @Get('list')
  @ApiOperation({ summary: 'List pinned file on pinata' })
  async getListPinned() {
    const res = await pinata.pinList();
    return res;
  }

  @Post('json')
  @ApiOperation({ summary: 'Save json data to pinata' })
  @ApiBody({
    type: 'formData',
    schema: {
      type: 'object',
    },
  })
  async testJSONPin(@Body() jsonData: JSON) {
    const body = jsonData;
    const options = {
      pinataMetadata: {
        name: 'testJSON',
        keyvalues: {
          customKey: 'customValue',
          customKey2: 'customValue2',
        },
      },
      pinataOptions: {
        cidVersion: 0,
      },
    };
    const res = await pinata.pinJSONToIPFS(body, options);
    return res;
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload file to pinata' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: 'formData',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const fileStream = Readable.from(file.buffer);
    const options = {
      pinataMetadata: {
        name: file.originalname,
        keyvalues: {
          customKey: 'customValue',
          customKey2: 'customValue2',
        },
      },
      pinataOptions: {
        cidVersion: 0,
      },
    };
    const res = await pinata.pinFileToIPFS(fileStream, options);
    console.log(res);
    return res;
  }
}
