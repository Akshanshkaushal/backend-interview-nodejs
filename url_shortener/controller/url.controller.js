import { nanoid } from "nanoid";
import validUrl from "valid-url";
import { Url } from "../model/urlSchema.js";

const createShortUrl = async (req, res) => {
  try {

    const { longUrl } = req.body;

    if (!validUrl.isWebUri(longUrl)) {
      return res.status(400).send({
        message: "invalid url",
        status: false,
      });
    }

    const code = nanoid(5);
    const shortUrl = `${process.env.BASE_URL}/${code}`;

    const url = await Url.create({
      code,
      longUrl,
      shortUrl,
    });

    res.status(201).send({
      message: "short url created",
      status: true,
      data: url,
    });

  } catch (e) {

    res.status.send({
      message: "internal server error",
      status: false,
    });

  }
};

const redirectToOriginalUrl = async (req, res) => {
  try {

    const { code } = req.params;
    
    if (!code) {
      return res.status(404).send({
        message: "invalid url",
        status: false,
      });
    }

    const url = await Url.findOne({
      code,
    });
    
    url.click = url.click + 1;
    url.save();
    res.redirect(url.longUrl);

  } catch (e) {
    res.status.send({
      message: "internal server error",
      status: false,
    });
  }
};

export { createShortUrl, redirectToOriginalUrl };
