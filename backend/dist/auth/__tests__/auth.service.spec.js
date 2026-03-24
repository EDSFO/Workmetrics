"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const auth_service_1 = require("../auth.service");
const users_service_1 = require("../../users/users.service");
const jwt_1 = require("@nestjs/jwt");
const common_1 = require("@nestjs/common");
describe('AuthService', () => {
    let service;
    let usersService;
    let jwtService;
    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: '$2b$10$hashedpassword',
        role: 'USER',
        teamId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    beforeEach(async () => {
        usersService = {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
        };
        jwtService = {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: users_service_1.UsersService, useValue: usersService },
                { provide: jwt_1.JwtService, useValue: jwtService },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
    });
    describe('register', () => {
        const registerDto = {
            email: 'new@example.com',
            password: 'password123',
            name: 'New User',
        };
        it('should throw ConflictException if user already exists', async () => {
            usersService.findByEmail.mockResolvedValue(mockUser);
            await expect(service.register(registerDto)).rejects.toThrow(common_1.ConflictException);
            expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
        });
        it('should create a new user and return access token', async () => {
            usersService.findByEmail.mockResolvedValue(null);
            usersService.create.mockResolvedValue(mockUser);
            const result = await service.register(registerDto);
            expect(usersService.create).toHaveBeenCalled();
            expect(jwtService.sign).toHaveBeenCalledWith({
                sub: mockUser.id,
                email: mockUser.email,
            });
            expect(result).toEqual({
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    name: mockUser.name,
                    role: mockUser.role,
                },
                accessToken: 'mock-jwt-token',
            });
        });
    });
    describe('login', () => {
        const loginDto = {
            email: 'test@example.com',
            password: 'password123',
        };
        it('should throw UnauthorizedException if user not found', async () => {
            usersService.findByEmail.mockResolvedValue(null);
            await expect(service.login(loginDto)).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('should throw UnauthorizedException if password is invalid', async () => {
            usersService.findByEmail.mockResolvedValue(mockUser);
            const bcrypt = require('bcrypt');
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
            await expect(service.login(loginDto)).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('should return user and access token on successful login', async () => {
            usersService.findByEmail.mockResolvedValue(mockUser);
            const bcrypt = require('bcrypt');
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
            const result = await service.login(loginDto);
            expect(result).toEqual({
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    name: mockUser.name,
                    role: mockUser.role,
                },
                accessToken: 'mock-jwt-token',
            });
        });
    });
    describe('validateUser', () => {
        it('should return user if found', async () => {
            usersService.findById.mockResolvedValue(mockUser);
            const result = await service.validateUser('user-123');
            expect(usersService.findById).toHaveBeenCalledWith('user-123');
            expect(result).toEqual(mockUser);
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map