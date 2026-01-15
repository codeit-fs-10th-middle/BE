async function findById(id) {
  throw new Error("Database not configured");
}

async function findByEmail(email) {
  throw new Error("Database not configured");
}

async function save(user) {
  throw new Error("Database not configured");
}

async function update(id, data) {
  throw new Error("Database not configured");
}

async function createOrUpdate(provider, providerId, email, name) {
  throw new Error("Database not configured");
}

export default {
  findById,
  findByEmail,
  save,
  update,
  createOrUpdate,
};
