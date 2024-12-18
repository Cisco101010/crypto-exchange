import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProviderService } from './provider.service';
import { CreateProviderDto } from './dto/provider.dto';
import { Provider } from './schemas/provider.schema';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Chat } from './schemas/chat-schema/chat.schema';
import { Message } from './schemas/chat-schema/message.schema';
import { AuthenticatedGuard } from '../guard/auth/authenticated.guard';

@Controller('provider')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @UseGuards(AuthenticatedGuard)
  @Post('create')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async createProvider(
    @Body() createProviderDto: CreateProviderDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Provider> {
    try {
      console.log(file);
      return await this.providerService.createProvider(createProviderDto);
    } catch (error) {
      throw new InternalServerErrorException('Error creating provider: ' + error.message);
    }
  }

  @UseGuards(AuthenticatedGuard)
  @Get('all')
  async findAllProviders(): Promise<Provider[]> {
    try {
      return await this.providerService.findAllProviders();
    } catch (error) {
      throw new InternalServerErrorException('Error fetching providers: ' + error.message);
    }
  }

  @Get('find/:email')
  async findProviderByEmail(@Param('email') email: string): Promise<Provider> {
    try {
      const provider = await this.providerService.findProviderByEmail(email);
      if (!provider) {
        throw new NotFoundException(`Provider with email ${email} not found`);
      }
      return provider;
    } catch (error) {
      throw new InternalServerErrorException('Error fetching provider: ' + error.message);
    }
  }

  @UseGuards(AuthenticatedGuard)
  @Post('chat/open')
  async openChat(
    @Body('userEmail') userEmail: string,  
    @Body('providerEmail') providerEmail: string, 
  ): Promise<{ chat: Chat }> { 
    try {
      return await this.providerService.openChat(userEmail, providerEmail); 
    } catch (error) {
      throw new InternalServerErrorException('Error opening chat: ' + error.message);
    }
  }

  @UseGuards(AuthenticatedGuard)
  @Post('chat/send')
  async sendMessage(
    @Body('senderId') senderId: string,
    @Body('chatId') chatId: string,
    @Body('messageContent') messageContent: string,
  ): Promise<Message> {
    try {
      return await this.providerService.sendMessage(senderId, chatId, messageContent);
    } catch (error) {
      throw new InternalServerErrorException('Error sending message: ' + error.message);
    }
  }

  @UseGuards(AuthenticatedGuard)
  @Get('chat/messages/:chatId')
  async getMessages(@Param('chatId') chatId: string): Promise<Message[]> {
    try {
      return await this.providerService.getMessages(chatId);
    } catch (error) {
      throw new InternalServerErrorException('Error fetching messages: ' + error.message);
    }
  }
}
