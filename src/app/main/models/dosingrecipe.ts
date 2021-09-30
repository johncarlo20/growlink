import { DosingRecipePartResponse } from './dosingrecipepartresponse';
import { DosingRecipeResponse } from './dosingreciperesponse';
import { Controller } from './controller';

export class DosingRecipe {
  Id?: string;
  DatabaseId?: number;
  ControllerId: string;
  Name: string;
  TargetTds: number;
  ScaleFactor: number;
  Parts: DosingRecipePartResponse[] = [];

  public static GetDosingRecipe(controller: Controller, source: DosingRecipeResponse): DosingRecipe {
    const recipe = new DosingRecipe();

    recipe.Id = source.Id;
    recipe.DatabaseId = source.DatabaseId;
    recipe.ControllerId = controller.Guid;
    recipe.Name = source.Name;
    recipe.TargetTds = source.TargetTds;
    recipe.ScaleFactor = source.ScaleFactor;
    recipe.Parts = new Array<DosingRecipePartResponse>();
    source.Parts.forEach(srcPart => {
      recipe.Parts.push({...srcPart});
    });

    return recipe;
  }

  public getDosingRecipeResponse(): DosingRecipeResponse {
    const tResponse = new DosingRecipeResponse();

    tResponse.Id = this.Id;
    tResponse.DatabaseId = this.DatabaseId;
    tResponse.Name = this.Name;
    tResponse.TargetTds = this.TargetTds;
    tResponse.ScaleFactor = this.ScaleFactor;
    tResponse.Parts = new Array<DosingRecipePartResponse>();
    this.Parts.forEach(part => {
      tResponse.Parts.push({...part});
    });

    return tResponse;
  }
}
