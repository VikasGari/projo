import { faker } from '@faker-js/faker';

export const generateUsers = (count = 5) => {
    return Array.from({ length: count }, () => ({
        id: faker.database.mongodbObjectId(),
        email: faker.internet.email(),
        handle: faker.internet.userName(),
        name: faker.name.fullName(),
        profile_image: faker.image.avatar(),
        teams_created: [],
        teams_joined: [],
        projects_created: [],
        projects_joined: [],
        friends: [],
        notifications: []
    }));
};

export const generateTeams = (count = 3, users = []) => {
    return Array.from({ length: count }, () => ({
        id: faker.database.mongodbObjectId(),
        creator_handle: faker.internet.userName(),
        creation_time: faker.date.past(),
        joiners_handle_and_joining_times: users.map(user => ({
            handle: user.handle,
            joining_time: faker.date.recent()
        })),
        projects_assigned: []
    }));
};

export const generateProjects = (count = 2, users = []) => {
    return Array.from({ length: count }, () => ({
        projectId: faker.database.mongodbObjectId(),
        admin: faker.internet.userName(),
        creator: faker.internet.userName(),
        teams_allowed: [],
        users_allowed: users.map(user => user.handle),
        status: "ongoing",
        tasks: Array.from({ length: 3 }, () => ({
            taskId: faker.database.mongodbObjectId(),
            title: faker.lorem.words(3),
            description: faker.lorem.sentence(),
            creator: faker.internet.userName(),
            status: "todo",
            assignedTo: []
        }))
    }));
};
