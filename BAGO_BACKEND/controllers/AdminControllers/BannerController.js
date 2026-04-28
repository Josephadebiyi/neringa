import cloudinary from 'cloudinary';
import { query, queryOne } from '../../lib/postgres/db.js';

async function ensureBannerTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS public.promotional_banners (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      image_url TEXT NOT NULL,
      link_url TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export const getBanners = async (req, res) => {
  try {
    await ensureBannerTable();
    const result = await query(
      `SELECT id, title, image_url as "imageUrl", link_url as "linkUrl",
              is_active as "isActive", sort_order as "sortOrder",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM public.promotional_banners
       ORDER BY sort_order ASC, created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Public endpoint — no auth required
export const getActiveBanners = async (req, res) => {
  try {
    await ensureBannerTable();
    const result = await query(
      `SELECT id, title, image_url as "imageUrl", link_url as "linkUrl", sort_order as "sortOrder"
       FROM public.promotional_banners
       WHERE is_active = TRUE
       ORDER BY sort_order ASC, created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBanner = async (req, res) => {
  try {
    await ensureBannerTable();
    const { title, linkUrl, sortOrder = 0 } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file is required' });
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        { folder: 'bago_banners', resource_type: 'image' },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.file.buffer);
    });

    const banner = await queryOne(
      `INSERT INTO public.promotional_banners (title, image_url, link_url, sort_order)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, image_url as "imageUrl", link_url as "linkUrl",
                 is_active as "isActive", sort_order as "sortOrder",
                 created_at as "createdAt"`,
      [title.trim(), uploadResult.secure_url, linkUrl?.trim() || null, sortOrder]
    );

    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBanner = async (req, res) => {
  try {
    await ensureBannerTable();
    const { title, linkUrl, sortOrder, isActive } = req.body;
    const fields = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title.trim()); }
    if (linkUrl !== undefined) { fields.push(`link_url = $${idx++}`); values.push(linkUrl?.trim() || null); }
    if (sortOrder !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(Number(sortOrder)); }
    if (isActive !== undefined) { fields.push(`is_active = $${idx++}`); values.push(Boolean(isActive)); }

    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          { folder: 'bago_banners', resource_type: 'image' },
          (err, result) => err ? reject(err) : resolve(result)
        );
        stream.end(req.file.buffer);
      });
      fields.push(`image_url = $${idx++}`);
      values.push(uploadResult.secure_url);
    }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    fields.push(`updated_at = NOW()`);
    values.push(req.params.id);

    const banner = await queryOne(
      `UPDATE public.promotional_banners SET ${fields.join(', ')}
       WHERE id = $${idx} RETURNING id, title, image_url as "imageUrl", link_url as "linkUrl",
                 is_active as "isActive", sort_order as "sortOrder", updated_at as "updatedAt"`,
      values
    );

    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleBanner = async (req, res) => {
  try {
    await ensureBannerTable();
    const banner = await queryOne(
      `UPDATE public.promotional_banners
       SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1
       RETURNING id, title, is_active as "isActive"`,
      [req.params.id]
    );
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    await ensureBannerTable();
    const banner = await queryOne(
      `DELETE FROM public.promotional_banners WHERE id = $1 RETURNING id, image_url`,
      [req.params.id]
    );
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });

    // Try to delete from Cloudinary
    const publicId = banner.image_url?.match(/bago_banners\/[^.]+/)?.[0];
    if (publicId) cloudinary.v2.uploader.destroy(publicId).catch(() => {});

    res.json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
