import { Company } from "../../models/Company.js";

const mapCompany = (doc) => {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    name: doc.name,
    createdAt: doc.createdAt,
  };
};

export const companyRepository = {
  async findByName(name, options = {}) {
    if (!name) return null;
    const query = Company.findOne({ name: name.trim() });
    if (options.session) query.session(options.session);
    const company = await query.lean();
    return mapCompany(company);
  },

  async create({ name }, options = {}) {
    const company = new Company({ name });
    await company.save({ session: options.session });
    return mapCompany(company.toObject());
  },
};
