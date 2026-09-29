/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Sign up
 *     description: Publicly creates a user account with the least-privileged role (boardUser).
 *     tags:
 *       - Users
 *     operationId: signUp
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 256
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 maxLength: 256
 *                 example: SecurePassword123!
 *               name:
 *                 type: string
 *                 maxLength: 128
 *                 example: John Doe
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 32
 *                 pattern: "^[a-zA-Z0-9]+((_{1}|\\.|){1}[a-zA-Z0-9])*$"
 *                 nullable: true
 *                 example: john_doe
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - item
 *               properties:
 *                 item:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */

const { isPassword } = require('../../../utils/validators');

const Errors = {
  EMAIL_ALREADY_IN_USE: {
    emailAlreadyInUse: 'Email already in use',
  },
  USERNAME_ALREADY_IN_USE: {
    usernameAlreadyInUse: 'Username already in use',
  },
  ACTIVE_LIMIT_REACHED: {
    activeLimitReached: 'Active limit reached',
  },
};

module.exports = {
  inputs: {
    email: {
      type: 'string',
      maxLength: 256,
      isEmail: true,
      required: true,
    },
    password: {
      type: 'string',
      maxLength: 256,
      custom: isPassword,
      required: true,
    },
    name: {
      type: 'string',
      maxLength: 128,
      required: true,
    },
    username: {
      type: 'string',
      isNotEmptyString: true,
      minLength: 3,
      maxLength: 32,
      regex: /^[a-zA-Z0-9]+((_|\.)?[a-zA-Z0-9])*$/,
      allowNull: true,
    },
  },

  exits: {
    emailAlreadyInUse: {
      responseType: 'conflict',
    },
    usernameAlreadyInUse: {
      responseType: 'conflict',
    },
    activeLimitReached: {
      responseType: 'conflict',
    },
  },

  async fn(inputs) {
    const values = {
      ..._.pick(inputs, ['email', 'password', 'name', 'username']),
      role: User.Roles.BOARD_USER,
    };

    const user = await sails.helpers.users.createOne
      .with({
        values,
        // No admin is performing this signup; createOne only forwards this to the
        // webhook payload as the triggering actor, so an id-less stand-in is safe.
        actorUser: {},
        request: this.req,
      })
      .intercept('emailAlreadyInUse', () => Errors.EMAIL_ALREADY_IN_USE)
      .intercept('usernameAlreadyInUse', () => Errors.USERNAME_ALREADY_IN_USE)
      .intercept('activeLimitReached', () => Errors.ACTIVE_LIMIT_REACHED);

    return {
      item: sails.helpers.users.presentOne(user, user),
    };
  },
};
